import './Avatar.css';

const Avatar = ({
  src,
  alt = 'Avatar',
  name,
  size = 'md',
  status,
  className = '',
  ...props
}) => {
  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.split(' ');
    if (names.length >= 2) {
      return `${names[0][0]}${names[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const classNames = [
    'avatar',
    `avatar-${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...props}>
      {src ? (
        <img src={src} alt={alt} className="avatar-image" />
      ) : (
        <span className="avatar-initials">{getInitials(name)}</span>
      )}
      {status && <span className={`avatar-status avatar-status-${status}`} />}
    </div>
  );
};

const AvatarGroup = ({ children, max = 4, className = '', ...props }) => {
  const childArray = Array.isArray(children) ? children : [children];
  const visibleAvatars = childArray.slice(0, max);
  const remainingCount = childArray.length - max;

  return (
    <div className={`avatar-group ${className}`} {...props}>
      {visibleAvatars}
      {remainingCount > 0 && (
        <div className="avatar avatar-md avatar-remaining">
          +{remainingCount}
        </div>
      )}
    </div>
  );
};

Avatar.Group = AvatarGroup;

export default Avatar;
