import { Alert, AlertDescription, AlertTitle } from '@thedaviddias/design-system/alert'
import { WebsiteError as SharedWebsiteError } from '@thedaviddias/web-core/website/website-error'

export function WebsiteError() {
  return (
    <SharedWebsiteError
      slots={{ Alert, AlertDescription, AlertTitle }}
    />
  )
}
