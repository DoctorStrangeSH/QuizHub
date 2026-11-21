export function renderMessageReadState({ isMine, readByRecipient }) {
    if (isMine !== true || typeof readByRecipient !== 'boolean') return '';
    const label = readByRecipient ? 'Прочитано' : 'Доставлено';
    const state = readByRecipient ? 'is-read' : 'is-sent';
    const glyph = readByRecipient ? '✓✓' : '✓';
    return `<span class="message-read-state ${state}" aria-label="${label}" title="${label}">${glyph}</span>`;
}
