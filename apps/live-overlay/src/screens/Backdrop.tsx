type Props = {
  src: string;
  tint: 'intro' | 'waiting' | 'game' | 'winner';
};

export function Backdrop({ src, tint }: Props) {
  return (
    <div className={`backdrop backdrop-${tint}`} data-swap-bg="1">
      <div className="backdrop-photo" style={{ backgroundImage: `url(${src})` }} />
      <div className="backdrop-tint" />
      {tint === 'intro' || tint === 'game' ? <div className="backdrop-vignette" /> : null}
    </div>
  );
}
