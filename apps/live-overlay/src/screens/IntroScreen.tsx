import { motion, useReducedMotion } from 'motion/react';
import { CrownIcon } from '../icons.js';

type Props = {
  settle: boolean;
};

export function IntroScreen({ settle }: Props) {
  const reduce = useReducedMotion();
  const instant = settle || Boolean(reduce);
  return (
    <div className="screen intro" data-screen="intro">
      <motion.div
        className="intro-logo"
        data-safe="intro-logo"
        initial={instant ? false : { scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: instant ? 0 : 0.7 }}
      >
        <div className="intro-halo" />
        <motion.div
          className="intro-crown"
          initial={instant ? false : { y: -80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.45, duration: instant ? 0 : 0.8 }}
        >
          <CrownIcon size={150} color="#fed100" />
        </motion.div>
        <motion.h1
          className="intro-ludi"
          initial={instant ? false : { y: -90, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ type: 'spring', bounce: 0.4, delay: instant ? 0 : 0.12 }}
        >
          LUDI
        </motion.h1>
        <motion.h2
          className="intro-live"
          initial={instant ? false : { y: 40, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: instant ? 0 : 0.45, delay: instant ? 0 : 0.28 }}
        >
          LIVE
        </motion.h2>
        <div className={`intro-stripe${instant ? ' drawn' : ''}`}>
          <span className="g" />
          <span className="y" />
          <span className="k" />
          <span className="y" />
          <span className="g" />
        </div>
        {instant ? null : <div className="intro-glint" />}
        <p className="intro-by">by StreamArchitect</p>
        <p className="intro-tag">Jamaican Ludi • Live on TikTok</p>
      </motion.div>
      <div className="intro-sun-window" />
      <div className="intro-soon" data-safe="starting-soon">
        <span className="live-dot" />
        <span>STARTING SOON</span>
      </div>
    </div>
  );
}
