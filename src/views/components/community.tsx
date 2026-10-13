import { communityHue } from "../../lib/community-hue";

const hueStyle = (id: number) => `--community-hue: ${communityHue(id)}`;

export function CommunityChip({ id, name }: { id: number; name: string }) {
  return (
    <a class="chip" href={`/c/${id}`} style={hueStyle(id)}>
      <span class="chip__text">{name}</span>
    </a>
  );
}

type CommunityCardProps = {
  id: number;
  name: string;
  description: string;
  /** 一覧内の通し番号（1始まり） */
  index: number;
};

export function CommunityCard({ id, name, description, index }: CommunityCardProps) {
  return (
    <article class="community-card" style={hueStyle(id)}>
      <span class="community-card__index num" aria-hidden="true">
        {String(index).padStart(2, "0")}
      </span>
      <h2 class="community-card__name">
        <a class="community-card__link" href={`/c/${id}`}>
          {name}
        </a>
      </h2>
      {description ? (
        <p class="community-card__desc">{description}</p>
      ) : (
        <p class="community-card__desc community-card__desc--empty">説明はありません</p>
      )}
    </article>
  );
}

export function CommunityGrid({ communities }: { communities: { id: number; name: string; description: string }[] }) {
  return (
    <ul class="community-grid" role="list">
      {communities.map((cm, i) => (
        <li>
          <CommunityCard id={cm.id} name={cm.name} description={cm.description} index={i + 1} />
        </li>
      ))}
    </ul>
  );
}
