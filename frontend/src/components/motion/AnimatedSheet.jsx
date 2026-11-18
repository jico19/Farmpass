import AnimatedDialog from './AnimatedDialog';

/** Responsive positioning belongs to the caller; this supplies sheet presence. */
export default function AnimatedSheet({ side = 'bottom', ...props }) {
    return <AnimatedDialog {...props} side={side} portal />;
}
