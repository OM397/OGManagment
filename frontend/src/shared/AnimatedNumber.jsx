import React from 'react';
import { useSpring, animated } from '@react-spring/web';
import { formatter } from './utils';

export default function AnimatedNumber({ value }) {
  const { number } = useSpring({
    from: { number: 0 },
    number: value,
    config: { mass: 1, tension: 140, friction: 20 }
  });

  return (
    <animated.span>
      {number.to(val => formatter.format(Number(val.toFixed(0))))}
    </animated.span>
  );
}
