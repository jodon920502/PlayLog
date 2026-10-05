export default function UserAvatar({ src, name, size = 'md' }: { src: string; name: string; size?: 'sm' | 'md' }) {
  return <img className={`${size === 'sm' ? 'h-7 w-7' : 'h-9 w-9'} rounded-full object-cover ring-2 ring-[#1a1d27]`} src={src} alt={name} />
}
