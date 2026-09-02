import type { Variants } from 'framer-motion';

export const expandVariants: Variants = {
    hidden: { opacity: 0, height: 0, overflow: 'hidden' },
    visible: { opacity: 1, height: 'auto', transition: { duration: 0.4, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, height: 0, transition: { duration: 0.3, ease: [0.4, 0, 1, 1] } }
};

export const pageVariants: Variants = {
    initial: { opacity: 0, x: 15, filter: "blur(4px)" },
    animate: { opacity: 1, x: 0, filter: "blur(0px)", transition: { duration: 0.45, ease: [0.4, 0, 0.2, 1] } },
    exit: { opacity: 0, x: -15, filter: "blur(4px)", transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } },
};

export const passwordFeedbackVariants: Variants = {
    hidden: { opacity: 0, height: 0, marginTop: 0 },
    visible: {
        opacity: 1,
        height: 'auto',
        marginTop: 15,
        transition: {
            height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
            marginTop: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
            opacity: { duration: 0.2, delay: 0.1 }
        }
    },
    exit: {
        opacity: 0,
        height: 0,
        marginTop: 0,
        transition: {
            height: { duration: 0.25, ease: "easeInOut" },
            marginTop: { duration: 0.25, ease: "easeInOut" },
            opacity: { duration: 0.15 }
        }
    }
};
