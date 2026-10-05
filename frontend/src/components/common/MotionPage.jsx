import { motion } from "framer-motion";
import { pageTransition } from "../../utils/motion";

// Wraps route/page content with a consistent entrance animation.
export default function MotionPage({ children, className }) {
  return (
    <motion.div
      className={className}
      variants={pageTransition}
      initial="initial"
      animate="animate"
    >
      {children}
    </motion.div>
  );
}
