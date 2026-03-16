'use client';

interface VKLoginButtonProps {
  className?: string;
}

export default function VKLoginButton({ className = '' }: VKLoginButtonProps) {
  const handleVKLogin = () => {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || '';
    window.location.href = `${apiBase}/api/auth/vk/login`;
  };

  return (
    <button
      onClick={handleVKLogin}
      className={`w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#0077FF] text-white rounded-lg hover:bg-[#0066DD] transition-colors font-medium ${className}`}
    >
      <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12.785 16.241s.288-.032.436-.194c.136-.148.132-.427.132-.427s-.02-1.304.574-1.496c.586-.19 1.341 1.26 2.138 1.815.605.421 1.064.329 1.064.329l2.137-.03s1.117-.071.587-.968c-.044-.074-.31-.665-1.597-1.88-1.349-1.273-1.168-1.067.457-3.271.99-1.341 1.387-2.16 1.263-2.51-.118-.334-.844-.246-.844-.246l-2.406.015s-.178-.025-.31.056c-.13.079-.213.263-.213.263s-.382 1.037-.89 1.92c-1.07 1.86-1.499 1.96-1.674 1.844-.408-.267-.306-1.072-.306-1.644 0-1.786.265-2.53-.517-2.724-.26-.064-.452-.107-1.118-.114-.854-.009-1.577.003-1.986.208-.272.136-.482.44-.354.458.158.022.516.099.706.363.245.341.236 1.107.236 1.107s.141 2.102-.329 2.364c-.324.18-.768-.187-1.722-1.865-.488-.864-.857-1.82-.857-1.82s-.071-.178-.198-.274c-.154-.116-.37-.153-.37-.153l-2.286.015s-.343.01-.469.162c-.112.135-.009.413-.009.413s1.797 4.289 3.831 6.453c1.867 1.986 3.986 1.854 3.986 1.854h.961z" />
      </svg>
      Войти через VK
    </button>
  );
}
