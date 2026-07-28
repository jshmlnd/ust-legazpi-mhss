const FadeIn = ({ children, className = '' }) => (
  <div className={`animate-[fadeIn_0.3s_ease-out] ${className}`}>
    {children}
  </div>
);

export default FadeIn;
