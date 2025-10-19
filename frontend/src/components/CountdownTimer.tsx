import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import ClockIcon from './icons/Clock'; // 导入时钟图标
import RefreshIcon from './icons/RefreshIcon'; // 导入刷新图标

// 定义组件的 props 类型
interface CountdownTimerProps {
  expiryTimestamp: number; // 过期时间戳 (毫秒)
  onExtend: () => void; // 新增：延长有效期的回调函数
}

// 格式化时间单位，确保总是显示两位数
const formatTimeUnit = (unit: number): string => {
  return unit < 10 ? `0${unit}` : `${unit}`;
};

export function CountdownTimer({ expiryTimestamp, onExtend }: CountdownTimerProps) {
  const { t } = useTranslation(); // 用于国际化

  // 计算剩余时间的函数 (使用 useCallback 避免不必要的重新创建)
  const calculateTimeLeft = useCallback(() => {
    const difference = expiryTimestamp - Date.now();
    let timeLeft = {
      hours: '00',
      minutes: '00',
      seconds: '00',
      expired: difference <= 0,
    };

    if (difference > 0) {
      timeLeft = {
        hours: formatTimeUnit(Math.floor((difference / (1000 * 60 * 60)) % 24)),
        minutes: formatTimeUnit(Math.floor((difference / 1000 / 60) % 60)),
        seconds: formatTimeUnit(Math.floor((difference / 1000) % 60)),
        expired: false,
      };
    }

    return timeLeft;
  // expiryTimestamp 作为依赖项，确保函数在时间戳变化时能获取最新值
  }, [expiryTimestamp]);

  // 使用 useState 来存储剩余时间
  const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

  // fix: 新增 useEffect 钩子，专门监听 expiryTimestamp 变化
  // 当 expiryTimestamp prop 更新时，立即重新计算并更新 timeLeft 状态
  useEffect(() => {
    setTimeLeft(calculateTimeLeft());
  }, [expiryTimestamp, calculateTimeLeft]); // 添加 calculateTimeLeft 作为依赖项

  // 使用 useEffect 来设置定时器，每秒更新剩余时间
  useEffect(() => {
    // 如果已经过期，则不设置定时器
    if (timeLeft.expired) {
      return;
    }

    // 每秒调用 calculateTimeLeft 来更新时间
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    // 组件卸载或依赖项变化时清除定时器
    return () => clearInterval(timer);
  // 依赖项现在只需要 timeLeft.expired 和 calculateTimeLeft
  // 因为 calculateTimeLeft 已经依赖于 expiryTimestamp
  }, [timeLeft.expired, calculateTimeLeft]);

  return (
    // feat: 将容器改为 flex-row 并添加按钮
    <div className="flex items-center justify-between gap-2 text-sm text-cyan-400 my-4 p-3 bg-white/5 rounded-md border border-cyan-50/20 shadow-inner">
      <div className="flex items-center gap-2"> {/* 将图标和文本包裹起来 */}
        <ClockIcon className="w-5 h-5" />
        {timeLeft.expired ? (
          <span>{t('Email expired')}</span> // 邮箱已过期提示
        ) : (
          <span>
            {t('Expires in')}: {timeLeft.hours}:{timeLeft.minutes}:{timeLeft.seconds}
          </span> // 显示剩余时间 时:分:秒
        )}
      </div>
      {/* feat: 添加延长有效期按钮 */}
      {!timeLeft.expired && (
        <button
          onClick={onExtend}
          className="p-1 rounded text-cyan-400 hover:text-cyan-300 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          title={t('Extend validity')} // 添加 tooltip
        >
          <RefreshIcon className="w-5 h-5" /> {/* 使用刷新图标 */}
        </button>
      )}
    </div>
  );
}