export enum ActionSheetButtonStyle { Default = 'DEFAULT', Destructive = 'DESTRUCTIVE', Cancel = 'CANCEL' }
export const ActionSheet = {
    showActions: async (opts: { title?: string; message?: string; options: Array<{ title: string; style?: ActionSheetButtonStyle }> }) => {
        const labels = opts.options.map((o, i) => `${i + 1}. ${o.title}`).join('\n');
        const idx = window.prompt(`${opts.title ?? ''}\n${labels}\n\nPodaj numer:`) ?? '';
        return { index: (parseInt(idx) || 1) - 1 };
    },
};
