import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { formatDistanceToNow } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import clsx from 'clsx';
// refactor: 将导入从 'database' 包更改为本地的类型定义文件
import type { Email } from '../database_types';

// 图标导入
import MailIcon from './icons/MailIcon.tsx';
import RefreshIcon from './icons/RefreshIcon.tsx';
import Loader from './icons/Loader.tsx';
import { WaitingEmail } from './icons/waiting-email.tsx';
import { TrashIcon } from './icons/TrashIcon.tsx';
import PasswordIcon from './icons/Password.tsx'; // feat: 导入密码图标
// feat: 导入新组件
import { MailDetail } from '../pages/MailDetail.tsx';
import ArrowUturnLeft from './icons/ArrowUturnLeft.tsx';
import Expand from './icons/Expand.tsx'; // feat: 导入 Expand 图标

interface MailListProps {
  emails: Email[];
  isLoading: boolean;
  isFetching: boolean;
  onDelete: (ids: string[]) => void;
  isDeleting: boolean;
  onRefresh: () => void;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  isAddressCreated: boolean;
  onSelectEmail: (email: Email) => void;
  showViewPasswordButton: boolean;
  onShowPassword: () => void;
  // feat: 新增 props，用于接收当前选中的邮件和关闭详情页的回调
  selectedEmail: Email | null;
  onCloseDetail: () => void;
  onExpand: () => void; // feat: 新增 onExpand 回调
}

export function MailList({ emails, isLoading, isFetching, onDelete, isDeleting, onRefresh, selectedIds, setSelectedIds, isAddressCreated, onSelectEmail, showViewPasswordButton, onShowPassword, selectedEmail, onCloseDetail, onExpand }: MailListProps) {
  const { t } = useTranslation();

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (emails.length === 0) return;
    if (selectedIds.length === emails.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(emails.map(e => e.id));
    }
  };

  const renderBody = () => {
    // feat: 如果有选中的邮件，则渲染邮件详情
    if (selectedEmail) {
      return <MailDetail email={selectedEmail} onClose={onCloseDetail} />;
    }

    // 状态 1: 还未创建地址
    if (!isAddressCreated) {
      return (
        <div className="w-full items-center h-full flex-col justify-center flex">
          <WaitingEmail />
          <p className="text-zinc-400 mt-6">请先创建一个临时邮箱地址</p>
        </div>
      );
    }

    // 状态 2: 正在进行首次加载
    if (isLoading) {
      return (
        <div className="w-full items-center h-full flex-col justify-center flex">
          <Loader />
          <p className="text-zinc-400 mt-6">{t("Waiting for emails...")}</p>
        </div>
      );
    }

    // 状态 3: 收件箱为空
    if (emails.length === 0) {
      return (
        <div className="w-full items-center h-full flex-col justify-center flex">
          {/* 修复: 只要地址已创建且邮箱为空，就持续显示加载动画 */}
          <Loader />
          <p className="text-zinc-400 mt-6">{t("Waiting for emails...")}</p>
        </div>
      );
    }

    // 状态 4: 显示邮件列表
    return emails.map((email: Email) => (
      <div key={email.id} className="flex items-center gap-2 mb-1">
        <input
          type="checkbox"
          className="h-4 w-4 rounded bg-zinc-700 border-zinc-600 text-cyan-600 focus:ring-cyan-500"
          checked={selectedIds.includes(email.id)}
          onChange={() => handleSelect(email.id)}
        />
        <div
          onClick={() => onSelectEmail(email)}
          className="cursor-pointer flex-1 flex flex-col items-start gap-2 rounded-lg border border-zinc-600 p-3 text-left text-sm transition-all hover:bg-zinc-700"
        >
          <div className="flex w-full flex-col gap-1">
            <div className="flex items-center">
              <div className="flex items-center gap-2">
                {/* feat: 在用户名后显示邮箱地址 */}
                <div className="font-semibold">{email.from?.name || email.messageFrom} {email.from?.address && `(${email.from.address})`}</div>
              </div>
              <div className={"ml-auto text-xs"}>
                {formatDistanceToNow(new Date(email.date || email.createdAt), {
                  addSuffix: true,
                  locale: zhCN,
                })}
              </div>
            </div>
            <div className="text-xs font-medium">{email.subject}</div>
          </div>
          <div className="line-clamp-2 text-xs text-zinc-300 font-normal w-full">
            {(email.text || email.html || "").substring(0, 300)}
          </div>
        </div>
      </div>
    ));
  }

  return (
    // fix: 添加 flex flex-col h-full 以确保在显示详情时容器能正确拉伸
    <div className="rounded-md border border-cyan-50/20 text-white flex flex-col h-full">
      {/* 邮件列表头部 */}
      <div className="w-full rounded-t-md p-2 flex items-center bg-zinc-800 text-zinc-200 gap-2">
        <div className="flex items-center justify-start gap-2 font-bold">
          <MailIcon className="size-6" />
          {t("INBOX")}
          {isAddressCreated && emails.length > 0 && !selectedEmail && (
            <span className="inline-flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-zinc-600 rounded-full">
              {emails.length}
            </span>
          )}
          {/* feat: 在详情页模式下，显示返回按钮 */}
          {selectedEmail && (
            <button
              onClick={onCloseDetail}
              className="flex items-center gap-1 text-sm font-semibold text-cyan-400 hover:text-cyan-300 ml-2"
            >
              <ArrowUturnLeft />
              返回邮件列表
            </button>
          )}
        </div>

        {/* 操作按钮区域 */}
        <div className="ml-auto flex items-center gap-2">
          {/* feat: 详情页模式下的操作按钮 */}
          {selectedEmail ? (
            <>
              <button
                onClick={onExpand}
                className="p-1 rounded text-cyan-400 hover:text-cyan-300"
                title="放大"
              >
                <Expand className="w-5 h-5" />
              </button>
              <button
                onClick={() => onDelete([selectedEmail.id])}
                disabled={isDeleting}
                className="p-1 rounded text-red-500 disabled:text-gray-500 hover:text-red-400"
                title="删除"
              >
                <TrashIcon className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              {/* 列表页模式下的操作按钮 */}
              {showViewPasswordButton && (
                <button
                  className="p-1 rounded text-cyan-400 hover:text-cyan-300"
                  title="查看密码"
                  onClick={onShowPassword}
                >
                  <PasswordIcon className="w-5 h-5" />
                </button>
              )}
              {isAddressCreated && emails.length > 0 && (
                <>
                  <input
                    type="checkbox"
                    className="h-4 w-4 rounded bg-zinc-700 border-zinc-600 text-cyan-600 focus:ring-cyan-500"
                    title='全选'
                    checked={selectedIds.length === emails.length && emails.length > 0}
                    onChange={handleSelectAll}
                  />
                  <button
                    onClick={() => onDelete(selectedIds)}
                    disabled={selectedIds.length === 0 || isDeleting}
                    className="p-1 rounded text-red-500 disabled:text-gray-500 hover:text-red-400"
                    title="删除选中"
                  >
                    <TrashIcon className="w-5 h-5" />
                  </button>
                </>
              )}
              <button
                className="p-1 rounded"
                title="refresh"
                onClick={onRefresh} // feat: 添加手动刷新事件
                // fix: 只有在创建地址后，刷新按钮才可用, 且在加载中时禁用
                disabled={!isAddressCreated || isFetching}
              >
                <RefreshIcon
                  className={clsx("size-6", isAddressCreated && "animate-spin")}
                />
              </button>
            </>
          )}
        </div>
      </div>

      {/* 邮件列表主体 */}
      {/* fix: 当显示详情时，移除 grids 背景和 h-[488px] 的高度限制 */}
      <div className={clsx("flex flex-col flex-1 overflow-y-auto p-2 min-h-0", !selectedEmail && "grids h-[488px]")}>
        {renderBody()}
      </div>
    </div>
  );
}
