import { Dispatch, SetStateAction, ReactNode, useEffect, useRef } from "react";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import clsx from "clsx";

export default function Leaflet({
  setShow,
  showBlur,
  children,
  theme = 'dark', // feat: 新增 theme 属性，默认为 'dark'
}: {
  setShow: Dispatch<SetStateAction<boolean>>;
  showBlur: boolean;
  children: ReactNode;
  theme?: 'light' | 'dark'; // feat: 定义 theme 属性类型
}) {
  const leafletRef = useRef<HTMLDivElement>(null);
  const controls = useAnimation();
  const transitionProps = { type: "spring", stiffness: 500, damping: 30 };
  useEffect(() => {
    controls.start({
      y: 20,
      transition: transitionProps,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleDragEnd(_: any, info: any) {
    const offset = info.offset.y;
    const velocity = info.velocity.y;
    const height = leafletRef.current?.getBoundingClientRect().height || 0;
    if (offset > height / 2 || velocity > 800) {
      await controls.start({ y: "100%", transition: transitionProps });
      setShow(false);
    } else {
      controls.start({ y: 0, transition: transitionProps });
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        ref={leafletRef}
        key="leaflet"
        className={clsx(
          "group fixed inset-x-0 bottom-0 z-40 w-screen cursor-grab overflow-y-scroll pb-5 active:cursor-grabbing sm:hidden",
          // fix: 根据 theme 属性动态设置背景色
          theme === 'dark' ? 'bg-neutral-800' : 'bg-white'
        )}
        style={{ maxHeight: "95%" }}
        initial={{ y: "100%" }}
        animate={controls}
        exit={{ y: "100%" }}
        transition={transitionProps}
        drag="y"
        dragDirectionLock
        onDragEnd={handleDragEnd}
        dragElastic={{ top: 0, bottom: 1 }}
        dragConstraints={{ top: 0, bottom: 0 }}>
        <div
          className={clsx(
            `rounded-t-4xl -mb-1 flex h-7 w-full items-center justify-center border-t`,
            // fix: 根据 theme 属性动态设置边框颜色
            theme === 'dark' ? 'border-neutral-700' : 'border-gray-200'
          )}>
          <div className={clsx(
            "-mr-1 h-1 w-6 rounded-full transition-all group-active:rotate-12",
            // fix: 根据 theme 属性动态设置滑块颜色
            theme === 'dark' ? 'bg-gray-500' : 'bg-gray-300'
          )} />
          <div className={clsx(
            "h-1 w-6 rounded-full transition-all group-active:-rotate-12",
            // fix: 根据 theme 属性动态设置滑块颜色
            theme === 'dark' ? 'bg-gray-500' : 'bg-gray-300'
          )} />
        </div>
        {children}
      </motion.div>
      {showBlur && (
        <motion.div
          key="leaflet-backdrop"
          className="fixed inset-0 z-30 bg-gray-100 bg-opacity-10 backdrop-blur"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShow(false)}
        />
      )}
    </AnimatePresence>
  );
}
