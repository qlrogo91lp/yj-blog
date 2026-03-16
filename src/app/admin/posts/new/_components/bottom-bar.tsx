import { PreviewButton } from './preview-button'
import { SaveStatus } from './save-status'
import { DraftButton } from './draft-button'
import { PublishButton } from './publish-button'

export function BottomBar() {
  return (
    <div className="sticky bottom-0 z-10 border-t bg-background px-4 py-3 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <PreviewButton />
        <SaveStatus />
      </div>

      <div className="flex items-center gap-2">
        <DraftButton />
        <PublishButton />
      </div>
    </div>
  )
}
