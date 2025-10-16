import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Turnstile } from '@marsidev/react-turnstile';
import randomName from "@scaleway/random-name";
import { useTranslation } from 'react-i18next';
import Cookies from 'js-cookie';
import { Toaster, toast } from 'react-hot-toast';

import { MailList } from '../components/MailList.tsx';
import { CopyButton } from '../components/CopyButton.tsx';
import { getEmails, deleteEmails, loginByPassword } from '../services/api.ts';
import { useConfig } from '../hooks/useConfig.ts';
import { getRandomCharacter } from '../lib/utlis.ts';
import { usePasswordModal } from '../components/password.tsx';
import PasswordIcon from '../components/icons/Password.tsx';
import ShieldCheck from "../components/icons/ShieldCheck.tsx";
import Cloudflare from "../components/icons/Cloudflare.tsx";
import Clock from "../components/icons/Clock.tsx";
import Info from "../components/icons/Info.tsx";
import type { Email } from '../database_types.ts';
import Lock from '../components/icons/Lock.tsx'; // 导入 Lock 图标

export function Home() {
  const config = useConfig();
  const { t } = useTranslation();
  const queryClient = useQueryClient();

  const [address, setAddress] = useState<string | undefined>(() => Cookies.get('userMailbox'));
  const [turnstileToken, setTurnstileToken] = useState<string>('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const { PasswordModal, setShowPasswordModal } = usePasswordModal();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  // feat: 新增状态来存储收到的第一封邮件的密码
  const [password, setPassword] = useState<string | null>(null);

  const { data: emails = [], isLoading, isFetching, refetch } = useQuery<Email[]>({
    queryKey: ['emails', address],
    queryFn: () => getEmails(address!, turnstileToken),
    enabled: !!address && !!turnstileToken,
    refetchInterval: 20000,
    onError: (err: Error) => {
      toast.error(`${t("Failed to get emails")}: ${err.message}`, { duration: 5000 });
    },
    retry: false,
  });

  // feat: 监听邮件列表的变化，当收到第一封邮件时，提取密码并提示用户
  useEffect(() => {
    if (emails.length > 0 && !password) {
      const firstEmailId = emails[0].id;
      setPassword(firstEmailId);
      toast.custom((t) => (
        <div
          className={`${
            t.visible ? 'animate-enter' : 'animate-leave'
          } max-w-md w-full bg-slate-800 shadow-lg rounded-lg pointer-events-auto flex ring-1 ring-black ring-opacity-5`}
        >
          <div className="flex-1 w-0 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0 pt-0.5">
                <Lock className="h-10 w-10 rounded-full" />
              </div>
              <div className="ml-3 flex-1">
                <p className="text-sm font-medium text-white">
                  {("您的临时邮箱密码")}
                </p>
                <p className="mt-1 text-sm text-gray-400">
                  {("这是您的登录凭证，请妥善保管！")}
                </p>
                <div className="mt-2 flex items-center text-zinc-100 bg-white/10 backdrop-blur-xl shadow-inner px-3 py-2 rounded-md w-full">
                    <span className="truncate">{firstEmailId}</span>
                    <CopyButton text={firstEmailId} className="p-1 rounded-md ml-auto" />
                </div>
              </div>
            </div>
          </div>
        </div>
      ), { duration: Infinity }); // 持续显示直到用户关闭
    }
  }, [emails, password]);

  const handleCreateAddress = () => {
    if (!turnstileToken) {
      toast.error(t('No captcha response'));
      return;
    }
    const mailbox = `${randomName("", getRandomCharacter())}@${config.emailDomain}`;
    Cookies.set('userMailbox', mailbox, { expires: 1 });
    setAddress(mailbox);
    setPassword(null); // 重置密码状态
  };

  const handleStopAddress = () => {
    Cookies.remove('userMailbox');
    setAddress(undefined);
    setPassword(null); // 清理密码
    queryClient.invalidateQueries({ queryKey: ['emails'] });
  };

  const deleteMutation = useMutation({
    mutationFn: (ids: string[]) => deleteEmails(ids, turnstileToken),
    onSuccess: () => {
      toast.success(t('Emails deleted'));
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['emails', address] });
    },
    onError: () => {
      toast.error(t('Deletion failed'));
    }
  });

  const handleDeleteEmails = (ids: string[]) => {
    if (ids.length === 0) {
      toast.error(t('Please select emails to delete'));
      return;
    }
    deleteMutation.mutate(ids);
  };

  const handleLogin = async (password: string) => {
    if (!turnstileToken) {
      toast.error(t('No captcha response'));
      return;
    }
    setIsLoggingIn(true);
    try {
      const data = await loginByPassword(password, turnstileToken);
      Cookies.set('userMailbox', data.address, { expires: 1 });
      setAddress(data.address);
      setShowPasswordModal(false);
      toast.success(t("Login successful"));
    } catch (error: any) {
      toast.error(`${t("Login failed")}: ${error.message}`);
    } finally {
      setIsLoggingIn(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-4 md:flex-row justify-center items-start mt-24 mx-6 md:mx-10">
      <Toaster position="top-center" />
      <PasswordModal onLogin={handleLogin} isLoggingIn={isLoggingIn} />
      <div className="flex flex-col text-white items-start w-full md:w-[350px] mx-auto gap-2">
        <div className="w-full mb-4 md:max-w-[350px] shrink-0 group group-hover:before:duration-500 group-hover:after:duration-500 after:duration-500 hover:border-cyan-600 hover:before:[box-shadow:_20px_20px_20px_30px_#a21caf] duration-500 before:duration-500 hover:duration-500 hover:after:-right-8 hover:before:right-12 hover:before:-bottom-8 hover:before:blur origin-left hover:decoration-2 relative bg-neutral-800 h-full border text-left p-4 rounded-lg overflow-hidden border-cyan-50/20 before:absolute before:w-12 before:h-12 before:content[''] before:right-1 before:top-1 before:z-10 before:bg-violet-500 before:rounded-full before:blur-lg  after:absolute after:z-10 after:w-20 after:h-20 after:content['']  after:bg-rose-300 after:right-8 after:top-3 after:rounded-full after:blur-lg">
          <h1 className="text-gray-50 text-xl font-bold mb-7 group-hover:text-cyan-500 duration-500">
            {t("Virtual Temporary Email")}
          </h1>
          <div className="flex flex-col gap-4 text-sm text-gray-200">
            <div className="flex items-center gap-1.5"><ShieldCheck /> {t("Privacy friendly")}</div>
            <div className="flex items-center gap-1.5"><Clock />{t("Valid for 1 Day")}</div>
            <div className="flex items-center gap-1.5"><Info />{t("AD friendly")}</div>
            <div className="flex items-center gap-2"><Cloudflare />{t("100% Run on Cloudflare")}</div>
          </div>
        </div>

        {address ? (
          <div className="w-full md:max-w-[350px] mb-4">
            <div className="mb-4 font-semibold text-sm">{t("Email address")}</div>
            <div className="flex items-center mb-6 text-zinc-100 bg-white/10 backdrop-blur-xl shadow-inner px-4 py-4 rounded-md w-full">
              <span className="truncate">{address}</span>
              <CopyButton text={address} className="p-1 rounded-md ml-auto" />
            </div>
            <button
              onClick={handleStopAddress}
              className="py-2.5 rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
              {t("Stop")}
            </button>
          </div>
        ) : (
          <div className="w-full md:max-w-[350px]">
            <div className="text-sm relative mb-4">
              <div className="mb-3 font-semibold">{t("Validater")}</div>
              <div className="[&_iframe]:!w-full h-[65px] max-w-[300px] bg-gray-700">
                <Turnstile siteKey={config.turnstileKey} onSuccess={setTurnstileToken} options={{ theme: "dark" }} />
              </div>
            </div>
            <button
              onClick={handleCreateAddress}
              disabled={!turnstileToken}
              className="py-2.5 rounded-md w-full bg-cyan-600 hover:opacity-90 disabled:cursor-not-allowed disabled:bg-zinc-500">
              {t("Create temporary email")}
            </button>
            <p
              className="mt-4 text-sm text-cyan-500 cursor-pointer"
              onClick={() => setShowPasswordModal(true)}>
              <PasswordIcon className="inline-block w-4 h-4 mr-2" />
              {t("Have a password? Login.")}
            </p>
          </div>
        )}
      </div>

      <div className="w-full flex-1 overflow-hidden">
        <MailList
          isAddressCreated={!!address}
          emails={emails}
          isLoading={isLoading}
          isFetching={isFetching}
          onDelete={handleDeleteEmails}
          isDeleting={deleteMutation.isPending}
          onRefresh={refetch}
          selectedIds={selectedIds}
          setSelectedIds={setSelectedIds}
        />
      </div>
    </div>
  );
}
