
const COLOR_MAP = {
  indigo: 'bg-indigo-100 text-indigo-700',
  purple: 'bg-purple-100 text-purple-700',
  blue:   'bg-blue-100 text-blue-700',
  gray:   'bg-gray-100 text-gray-600',
};

const SIZE_MAP = {
  sm:  'w-8 h-8 text-sm',
  md:  'w-9 h-9 text-sm',
  lg:  'w-16 h-16 text-2xl',
};

export default function AvatarInitial({ name = '?', color = 'purple', size = 'md' }) {
  return (
    <div className={`rounded-full font-semibold flex items-center justify-center
                     flex-shrink-0 ${COLOR_MAP[color]} ${SIZE_MAP[size]}`}>
      {name.charAt(0).toUpperCase()}
    </div>
  );
}


