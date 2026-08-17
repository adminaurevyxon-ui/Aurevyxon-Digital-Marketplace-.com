import logoImg from "@/assets/images/market_logo_1784884442864.jpg";

export function Logo({ className = "w-8 h-8" }: { className?: string }) {
  return (
    <img 
      src={logoImg} 
      alt="Aurevyxon Logo" 
      className={`object-cover rounded-xl shadow-[0_0_15px_rgba(0,150,255,0.3)] border border-blue-500/30 ${className}`} 
      referrerPolicy="no-referrer"
    />
  );
}
