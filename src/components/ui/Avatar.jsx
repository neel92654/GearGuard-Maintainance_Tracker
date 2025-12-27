/**
 * GearGuard - Avatar Component
 * 
 * User avatar with fallback initials.
 */

function Avatar({
  name,
  src,
  size = 'md',
  className = ''
}) {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg'
  };

  // Generate initials from name
  const getInitials = (name) => {
    if (!name) return '?';
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  // Generate a consistent color based on name
  const getColor = (name) => {
    if (!name) return 'bg-gray-400';
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-teal-500',
      'bg-orange-500'
    ];
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[index % colors.length];
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name || 'Avatar'}
        className={`
          ${sizes[size]}
          rounded-full object-cover
          ${className}
        `}
      />
    );
  }

  return (
    <div
      className={`
        ${sizes[size]}
        ${getColor(name)}
        rounded-full flex items-center justify-center
        text-white font-medium
        ${className}
      `}
    >
      {getInitials(name)}
    </div>
  );
}

function AvatarGroup({ children, max = 4, size = 'md' }) {
  const childArray = Array.isArray(children) ? children : [children];
  const visible = childArray.slice(0, max);
  const remaining = childArray.length - max;

  return (
    <div className="flex -space-x-2">
      {visible.map((child, index) => (
        <div key={index} className="ring-2 ring-white rounded-full">
          {child}
        </div>
      ))}
      {remaining > 0 && (
        <div
          className={`
            ${size === 'sm' ? 'w-8 h-8 text-xs' : 'w-10 h-10 text-sm'}
            rounded-full bg-gray-200 text-gray-600 font-medium
            flex items-center justify-center
            ring-2 ring-white
          `}
        >
          +{remaining}
        </div>
      )}
    </div>
  );
}

Avatar.Group = AvatarGroup;

export default Avatar;
