import { useTranslation } from "react-i18next";
import { format } from "date-fns/format";

// 导入图标
// 修复：将命名导入更改为默认导入，以匹配图标组件的导出方式
import ArrowUturnLeft from '../components/icons/ArrowUturnLeft.tsx';
import UserCircleIcon from '../components/icons/UserCircleIcon.tsx';

import type { Email } from '../database_types'; // 导入 Email 类型

// 定义 MailDetail 组件的 props
interface MailDetailProps {
  email: Email;
  onClose: () => void; // 用于关闭详情视图的回调函数
}

export function MailDetail({ email, onClose }: MailDetailProps) {
  const { t } = useTranslation();

  // 处理邮件内容的显示，将 HTML 字符串渲染到 iframe 中
  const createMarkup = (htmlContent: string) => {
    // 为了安全，最好对 htmlContent 进行清理，这里为了简化直接使用
    return `data:text/html;charset=utf-8,${encodeURIComponent(htmlContent)}`;
  };

  return (
    <div className="flex flex-1 flex-col p-2 gap-10 text-white bg-zinc-800 rounded-md">
      <button
        onClick={onClose}
        className="flex w-fit font-semibold items-center border p-2 rounded-md gap-2">
        <ArrowUturnLeft />
        {t("Back Home")}
      </button>
      <div className="flex items-start">
        <div className="flex items-start gap-4 text-sm">
          <div>
            <UserCircleIcon className="w-6 h-6"/>
          </div>
          <div className="grid gap-1">
            <div className="font-semibold">{email.from.name}</div>
            <div className="line-clamp-1 text-xs">{email.subject}</div>
            <div className="line-clamp-1 text-xs">
              <span className="font-medium">{t("Reply-To:")}</span> {email.from.address}
            </div>
          </div>
        </div>
        {email.date && (
          <div className="ml-auto text-xs text-muted-foreground">
            {format(new Date(email.date), "PPpp")}
          </div>
        )}
      </div>
      <div className="flex-1 flex text-sm bg-[#ffffffd6] backdrop-blur-xl rounded-md p-3 min-h-0">
        <iframe
            srcDoc={email.html || `<pre>${email.text}</pre>`}
            className="w-full h-[60vh] border-0"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            title="Email Content"
          />
      </div>
    </div>
  );
}

