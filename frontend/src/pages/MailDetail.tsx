import { useTranslation } from "react-i18next";
import { format } from "date-fns/format";

// 导入图标
import UserCircleIcon from '../components/icons/UserCircleIcon.tsx';

import type { Email } from '../database_types'; // 导入 Email 类型

// 定义 MailDetail 组件的 props
interface MailDetailProps {
  email: Email;
  onClose: () => void; // 用于关闭详情视图的回调函数
}

export function MailDetail({ email, onClose }: MailDetailProps) {
  const { t } = useTranslation();

  return (
    // refactor: 移除外部的 p-2 gap-10，将其移到 MailList 中控制
    // feat: 使用 flex-col 和 h-full 让详情页填满父容器
    <div className="flex flex-1 flex-col text-white h-full">
      {/* refactor: 移除返回按钮，它现在位于 MailList 的标题栏中 */}
      <div className="flex items-start mb-4">
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
      {/* fix: 调整 iframe 的容器和样式，以适应在 MailList 中显示 */}
      {/* feat: 使用 flex-1 和 min-h-0 确保 iframe 容器能正确填充剩余空间 */}
      <div className="flex-1 flex text-sm bg-[#ffffffd6] backdrop-blur-xl rounded-md min-h-0">
        <iframe
            srcDoc={email.html || `<pre>${email.text}</pre>`}
            // refactor: 将 h-[60vh] 改为 h-full 以自适应容器
            className="w-full h-full border-0"
            sandbox="allow-popups allow-popups-to-escape-sandbox"
            title="Email Content"
          />
      </div>
    </div>
  );
}

