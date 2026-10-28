import {Composition} from 'remotion';
import {TOTAL_FRAMES} from './timeline';
import {TradingMoneyBall} from './Video';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="TradingMoneyBall-9x16" component={TradingMoneyBall} durationInFrames={TOTAL_FRAMES} fps={30} width={1080} height={1920} />
      <Composition id="TradingMoneyBall-16x9" component={TradingMoneyBall} durationInFrames={TOTAL_FRAMES} fps={30} width={1920} height={1080} />
    </>
  );
};
