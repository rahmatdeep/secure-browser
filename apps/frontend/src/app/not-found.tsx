import Link from "next/link";
import { ArrowRight } from "lucide-react";
import {
  StatusScreen,
  statusActionClass,
} from "@/components/StatusScreen";

export default function NotFound() {
  return (
    <StatusScreen
      kicker="Not found"
      title="There's nothing at this address."
      body="The link may be mistyped, or it may point at a session that has already been cleaned up. Sessions are not kept, so old links stop resolving rather than coming back."
    >
      <Link href="/" className={statusActionClass}>
        Open a session
        <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
      </Link>
    </StatusScreen>
  );
}
