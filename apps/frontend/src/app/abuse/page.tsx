import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { Pending } from "@/components/Pending";

export const metadata: Metadata = {
  title: "Report abuse — SafeWeb",
  description: "How to report misuse of SafeWeb, and what happens next.",
  robots: { index: false, follow: false },
};

export default function AbusePage() {
  return (
    <LegalPage
      title="Report abuse"
      intro="If this service has been used to reach or attack something of yours, tell us directly. Reports sent here are read by the people who run it."
    >
      <LegalSection heading="Where to send a report">
        <p>
          <Pending id="D3">
            a monitored contact address for abuse and takedown reports
          </Pending>
        </p>
      </LegalSection>

      <LegalSection heading="What to include">
        <p>
          Traffic from this service arrives from our infrastructure rather than
          from the person who caused it, so the more precise the report, the
          more likely we can identify the session behind it.
        </p>
        <ul>
          <li>The date and time, with the timezone.</li>
          <li>The source address the traffic came from.</li>
          <li>
            What was requested or what happened — a URL, a log excerpt, or a
            short description.
          </li>
          <li>How to reach you if we need more detail.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="Report quickly if you can">
        <p>
          Sessions last ten minutes and the container is destroyed when they
          end. A report that arrives while a session is still running can be
          acted on directly; a later one can only be matched against whatever
          session records still exist.
        </p>
      </LegalSection>

      <LegalSection heading="What we do">
        <p>
          We stop sessions that are being used against the{" "}
          <Link href="/terms">terms of use</Link>, and we can block further
          access. Material that is illegal rather than merely against the terms
          is reported to the relevant authorities.
        </p>
        <p>
          <Pending id="D10">
            the response time to commit to publicly, and whether reporters get
            a reply confirming the outcome
          </Pending>
        </p>
      </LegalSection>

      <LegalSection heading="For hosting and network providers">
        <p>
          If you are a provider acting on a complaint, use the address above
          and we will respond directly rather than through an intermediary.{" "}
          <Pending id="D1">
            the operating person or company, and the country it operates from
          </Pending>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
