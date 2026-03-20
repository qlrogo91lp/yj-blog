import { PreviewButton } from './preview-button'
import { SaveStatusAction } from '../_actions/save-status-action'
import { DraftAction } from '../_actions/draft-action'
import { PublishAction } from '../_actions/publish-action'

export function BottomBar() {
  return (
    <div className="sticky bottom-0 z-10 border-t bg-background px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <PreviewButton />
        <SaveStatusAction />
      </div>

      <div className="flex items-center gap-2">
        <DraftAction />
        <PublishAction />
      </div>
    </div>
  )
}
