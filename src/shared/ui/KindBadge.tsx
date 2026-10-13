import { KIND_LABEL, type EntityKind } from '../../domain/index.ts';

export function KindBadge({ kind }: { kind: EntityKind }) {
  return <span className={`badge kind-${kind}`}>{KIND_LABEL[kind]}</span>;
}
