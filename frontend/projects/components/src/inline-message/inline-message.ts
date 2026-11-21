import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** The inline messages the app draws so far; the icon, the colour and the words carry the tone together. */
export type InlineMessageTone = 'warn';

/**
 * One line, or a short paragraph, inside a panel or under a frame (design-system block inline-message), with the tone's
 * icon before the projected text.
 */
@Component({
  selector: 'wz-inline-message',
  templateUrl: './inline-message.html',
  styleUrl: './inline-message.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InlineMessage {
  readonly tone = input<InlineMessageTone>('warn');
}
