import { beforeEach, describe, expect, it, vi } from 'vitest';
import { db } from '@/db';
import { postImages, posts } from '@/db/schema';
import { deleteR2Objects } from '@/lib/r2';
import { savePost } from './save-post';

vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(async () => ({ userId: 'user_test' })),
}));

vi.mock('next/cache', () => ({
  revalidateTag: vi.fn(),
  revalidatePath: vi.fn(),
}));

// cleanupOrphanImages가 사용하는 실제 R2 클라이언트를 대체한다. 실제 R2 env
// 값은 필요 없다 — deleteR2Objects 호출 여부/인자만 검증하면 충분하다.
// r2PublicUrl은 테스트별로 값을 바꿔야 하므로(r2PublicUrl 미설정 케이스 검증)
// vi.hoisted로 만든 상태를 getter로 노출해 매 접근마다 최신 값을 읽게 한다.
const r2State = vi.hoisted(() => ({ publicUrl: 'https://pub.example.com' }));

vi.mock('@/lib/r2', () => ({
  deleteR2Objects: vi.fn(async () => undefined),
  get r2PublicUrl() {
    return r2State.publicUrl;
  },
}));

/** select().from().where().limit()이 최종적으로 이 배열을 resolve한다. (posts.publishedAt 조회) */
let selectResult: { publishedAt: Date | null }[] = [];
/** cleanupOrphanImages의 select(postImages)...where()가 resolve할 행. */
let postImagesRows: { id: number; key: string }[] = [];
/** update().set()에 전달된 값을 검증용으로 수집한다. */
const updateSetArgs: Record<string, unknown>[] = [];
/** insert(posts)에 전달된 값을 검증용으로 수집한다(INSERT 경로에서 사용). */
const insertPostsValuesArgs: Record<string, unknown>[] = [];
let insertPostsReturning: { id: number }[] = [{ id: 1 }];
/** delete(table)에 전달된 테이블을 순서대로 수집한다. */
const deleteTableArgs: unknown[] = [];
/** delete(table).where(arg)의 arg를 deleteTableArgs와 같은 순서로 수집한다. */
const deleteWhereArgs: unknown[] = [];
/** select().from(table)에 전달된 테이블을 순서대로 수집한다. */
const selectFromArgs: unknown[] = [];

let lastSelectedTable: unknown = null;

const selectChain = {
  from: vi.fn((table: unknown) => {
    lastSelectedTable = table;
    selectFromArgs.push(table);
    return selectChain;
  }),
  where: vi.fn(() => {
    // postImages 조회는 .limit() 없이 바로 await되므로 여기서 Promise를 반환한다.
    if (lastSelectedTable === postImages) {
      return Promise.resolve(postImagesRows);
    }
    return selectChain;
  }),
  limit: vi.fn(() => Promise.resolve(selectResult)),
};

const deleteChain = {
  where: vi.fn((arg: unknown) => {
    deleteWhereArgs.push(arg);
    return Promise.resolve(undefined);
  }),
};

vi.mock('@/db', () => ({
  db: {
    select: vi.fn(() => selectChain),
    update: vi.fn(() => ({
      set: vi.fn((data: Record<string, unknown>) => {
        updateSetArgs.push(data);
        return { where: vi.fn(() => Promise.resolve(undefined)) };
      }),
    })),
    insert: vi.fn(() => ({
      values: vi.fn((data: unknown) => {
        insertPostsValuesArgs.push(data as Record<string, unknown>);
        return {
          returning: vi.fn(() => Promise.resolve(insertPostsReturning)),
        };
      }),
    })),
    delete: vi.fn((table: unknown) => {
      deleteTableArgs.push(table);
      return deleteChain;
    }),
  },
}));

const baseInput = {
  postId: 42,
  title: '제목',
  slug: 'post-slug',
  content: '<p>본문</p>',
  categoryId: null,
  seriesId: null,
  status: 'draft' as const,
};

describe('savePost — publishedAt 결정 로직', () => {
  beforeEach(() => {
    vi.mocked(db.select).mockClear();
    vi.mocked(db.update).mockClear();
    vi.mocked(db.insert).mockClear();
    vi.mocked(db.delete).mockClear();
    vi.mocked(deleteR2Objects).mockClear();
    updateSetArgs.length = 0;
    insertPostsValuesArgs.length = 0;
    insertPostsReturning = [{ id: 1 }];
    selectResult = [];
    postImagesRows = [];
    deleteTableArgs.length = 0;
    deleteWhereArgs.length = 0;
    selectFromArgs.length = 0;
  });

  it('UPDATE + published + 기존 publishedAt이 있으면 그대로 유지한다', async () => {
    const existing = new Date('2026-01-01T00:00:00Z');
    selectResult = [{ publishedAt: existing }];

    const result = await savePost({ ...baseInput, status: 'published' });

    expect(result.success).toBe(true);
    expect(updateSetArgs).toHaveLength(1);
    expect(updateSetArgs[0].publishedAt).toEqual(existing);
    if (result.success) {
      expect(result.publishedAt).toEqual(existing);
    }
  });

  it('UPDATE + published + 기존 publishedAt이 null이면(첫 발행) 새 Date를 세팅한다', async () => {
    selectResult = [{ publishedAt: null }];
    const before = new Date();

    const result = await savePost({ ...baseInput, status: 'published' });

    expect(result.success).toBe(true);
    expect(updateSetArgs).toHaveLength(1);
    const setPublishedAt = updateSetArgs[0].publishedAt;
    expect(setPublishedAt).not.toBeNull();
    expect(setPublishedAt).toBeInstanceOf(Date);
    expect((setPublishedAt as Date).getTime()).toBeGreaterThanOrEqual(
      before.getTime()
    );
  });

  it('UPDATE + draft면 기존 publishedAt 값과 무관하게 null로 세팅한다', async () => {
    selectResult = [{ publishedAt: new Date('2026-01-01T00:00:00Z') }];

    const result = await savePost({ ...baseInput, status: 'draft' });

    expect(result.success).toBe(true);
    expect(updateSetArgs).toHaveLength(1);
    expect(updateSetArgs[0].publishedAt).toBeNull();
    if (result.success) {
      expect(result.publishedAt).toBeNull();
    }
  });

  it('UPDATE 대상 postId가 DB에 없으면 실패를 반환하고 db.update를 호출하지 않는다', async () => {
    selectResult = [];

    const result = await savePost({ ...baseInput, status: 'published' });

    expect(result).toEqual({ success: false, error: '글을 찾을 수 없습니다' });
    expect(db.update).not.toHaveBeenCalled();
    expect(updateSetArgs).toHaveLength(0);
  });

  it('postId가 없으면(INSERT) publishedAt은 posts.publishedAt 조회 없이 status로만 결정한다', async () => {
    const { postId: _postId, ...withoutPostId } = baseInput;

    const result = await savePost({ ...withoutPostId, status: 'published' });

    expect(result.success).toBe(true);
    // cleanupOrphanImages가 INSERT 후 postImages를 조회하므로 db.select 자체는 호출되지만,
    // publishedAt 결정을 위한 posts 테이블 조회는 일어나지 않아야 한다.
    expect(selectFromArgs).not.toContain(posts);
    expect(insertPostsValuesArgs).toHaveLength(1);
    expect(insertPostsValuesArgs[0].publishedAt).toBeInstanceOf(Date);
  });
});

describe('savePost — contentFormat은 항상 html로 저장된다', () => {
  beforeEach(() => {
    vi.mocked(db.select).mockClear();
    vi.mocked(db.update).mockClear();
    vi.mocked(db.insert).mockClear();
    vi.mocked(db.delete).mockClear();
    vi.mocked(deleteR2Objects).mockClear();
    updateSetArgs.length = 0;
    insertPostsValuesArgs.length = 0;
    insertPostsReturning = [{ id: 1 }];
    selectResult = [];
    postImagesRows = [];
    deleteTableArgs.length = 0;
    deleteWhereArgs.length = 0;
    selectFromArgs.length = 0;
  });

  it('UPDATE 경로는 contentFormat을 html로 저장한다', async () => {
    selectResult = [{ publishedAt: null }];

    const result = await savePost({ ...baseInput, status: 'draft' });

    expect(result.success).toBe(true);
    expect(updateSetArgs).toHaveLength(1);
    expect(updateSetArgs[0].contentFormat).toBe('html');
  });

  it('INSERT 경로는 contentFormat을 html로 저장한다', async () => {
    const { postId: _postId, ...withoutPostId } = baseInput;

    const result = await savePost({ ...withoutPostId, status: 'draft' });

    expect(result.success).toBe(true);
    expect(insertPostsValuesArgs).toHaveLength(1);
    expect(insertPostsValuesArgs[0].contentFormat).toBe('html');
  });

  it('호출자가 contentFormat을 다른 값으로 끼워 넣어도 무시하고 html로 저장한다', async () => {
    // SavePostInput 타입에는 contentFormat 필드가 없다 — 타입을 우회해 다른 값을
    // 넣더라도 savePost 내부에서 항상 'html'로 덮어쓰는지를 검증한다(호출자 입력은
    // 무관하다는 것이 실제 테스트 대상 계약이다).
    const { postId: _postId, ...withoutPostId } = baseInput;
    const inputWithForeignContentFormat = {
      ...withoutPostId,
      status: 'draft' as const,
      contentFormat: 'markdown',
    };

    const result = await savePost(inputWithForeignContentFormat);

    expect(result.success).toBe(true);
    expect(insertPostsValuesArgs).toHaveLength(1);
    expect(insertPostsValuesArgs[0].contentFormat).toBe('html');
  });
});

describe('savePost — 저장 시점 고아 이미지 정리 (cleanupOrphanImages)', () => {
  const r2PublicUrl = 'https://pub.example.com';
  const keyA = 'images/post-42/a.png';
  const keyB = 'images/post-42/b.png';

  beforeEach(() => {
    vi.mocked(db.select).mockClear();
    vi.mocked(db.update).mockClear();
    vi.mocked(db.insert).mockClear();
    vi.mocked(db.delete).mockClear();
    vi.mocked(deleteR2Objects).mockClear();
    updateSetArgs.length = 0;
    insertPostsValuesArgs.length = 0;
    insertPostsReturning = [{ id: 1 }];
    selectResult = [{ publishedAt: null }]; // UPDATE 경로가 '글을 찾을 수 없습니다'로 빠지지 않도록
    postImagesRows = [];
    deleteTableArgs.length = 0;
    deleteWhereArgs.length = 0;
    selectFromArgs.length = 0;
    r2State.publicUrl = r2PublicUrl; // 다른 테스트가 바꿔놓은 값이 있으면 원복
  });

  it('본문·썸네일 어디에도 참조되지 않는 post_images row는 R2와 DB에서 삭제한다', async () => {
    postImagesRows = [
      { id: 1, key: keyA },
      { id: 2, key: keyB },
    ];

    const result = await savePost({
      ...baseInput,
      content: `<p><img src="${r2PublicUrl}/${keyA}"></p>`,
    });

    expect(result.success).toBe(true);
    expect(deleteR2Objects).toHaveBeenCalledWith([keyB]);
    expect(deleteTableArgs).toContain(postImages);
  });

  it('본문 또는 썸네일에서 여전히 참조 중인 이미지는 삭제하지 않는다', async () => {
    postImagesRows = [
      { id: 1, key: keyA },
      { id: 2, key: keyB },
    ];

    const result = await savePost({
      ...baseInput,
      content: `<p><img src="${r2PublicUrl}/${keyA}"></p>`,
      thumbnailUrl: `${r2PublicUrl}/${keyB}`,
    });

    expect(result.success).toBe(true);
    expect(deleteR2Objects).not.toHaveBeenCalled();
    expect(deleteTableArgs).not.toContain(postImages);
  });

  it('post_images row가 없으면(정리할 것이 없으면) R2·DB 삭제를 시도하지 않는다', async () => {
    postImagesRows = [];

    const result = await savePost({
      ...baseInput,
      content: `<p><img src="${r2PublicUrl}/${keyA}"></p>`,
    });

    expect(result.success).toBe(true);
    expect(deleteR2Objects).not.toHaveBeenCalled();
    expect(deleteTableArgs).not.toContain(postImages);
  });

  it('cleanupOrphanImages가 실패해도 savePost 자체는 성공을 반환한다', async () => {
    postImagesRows = [
      { id: 1, key: keyA },
      { id: 2, key: keyB },
    ];
    vi.mocked(deleteR2Objects).mockRejectedValueOnce(new Error('R2 삭제 실패'));

    const result = await savePost({
      ...baseInput,
      content: `<p><img src="${r2PublicUrl}/${keyA}"></p>`,
    });

    expect(result.success).toBe(true);
    // 정리 시도는 실제로 일어났다 — 실패가 조용히 스킵된 게 아니라 catch로 흡수된 것.
    expect(deleteR2Objects).toHaveBeenCalledWith([keyB]);
  });

  it('r2PublicUrl이 비어 있으면(env 미설정) 모든 row가 고아처럼 보여도 정리를 건너뛴다', async () => {
    r2State.publicUrl = '';
    postImagesRows = [
      { id: 1, key: keyA },
      { id: 2, key: keyB },
    ];

    const result = await savePost({
      ...baseInput,
      // r2PublicUrl이 비어 있으면 extractR2Keys가 빈 Set을 반환하므로, 본문에
      // 이미지가 참조돼 있어도(=고아가 아니어도) keep을 계산할 수 없는 상태다.
      content: `<p><img src="${r2PublicUrl}/${keyA}"></p>`,
    });

    expect(result.success).toBe(true);
    expect(deleteR2Objects).not.toHaveBeenCalled();
    expect(deleteTableArgs).not.toContain(postImages);
  });
});
