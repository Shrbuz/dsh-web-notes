/**
 * Notes settings card — the `notes` entry inside the web settings surface
 * (设置 → 插件 → 插件配置). Follows the official plugin-card pattern: a
 * collapsible header (name + description + chevron) that expands into the
 * form. Every control writes straight back through the bound settings scope,
 * so changes apply to the floating UI live — no save/discard footer needed.
 * @module dsh-web-notes/client/NotesSettingsCard
 */
import { type ReactElement } from 'react';
import type { SettingsScope } from '@deepseek-ai/dsh-client-runtime/client';
import type { NotesUiSettings } from './settings.ts';
/** Props of the notes settings card (injected through the slot entry). */
export interface NotesSettingsCardProps {
    /** The bound `notes` settings scope (reads + writes). */
    scope: SettingsScope<NotesUiSettings>;
    /** Translation helper (notes locale dictionary). */
    notesT: (key: string) => string;
}
/** The notes plugin card in 设置 → 插件 → 插件配置. */
export declare function NotesSettingsCard(props: NotesSettingsCardProps): ReactElement | null;
//# sourceMappingURL=NotesSettingsCard.d.ts.map