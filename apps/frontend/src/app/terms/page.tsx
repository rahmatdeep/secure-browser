import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { Pending } from "@/components/Pending";

export const metadata: Metadata = {
  title: "Terms — SafeWeb",
  description: "The rules for using SafeWeb, and what it does not promise.",
  robots: { index: false, follow: false },
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of use"
      intro="What you can and cannot use this service for, and what it does not promise. Using it means accepting these terms."
    >
      <LegalSection heading="What the service is">
        <p>
          SafeWeb opens a web address inside a temporary browser running on our
          infrastructure and streams the screen back to you. The session ends
          automatically after ten minutes, or sooner if you stop it, and the
          container is destroyed when it ends.
        </p>
        <p>
          <Pending id="D7">
            which limits to state publicly — session length, how many sessions
            one visitor may run at once, any daily cap
          </Pending>
        </p>
      </LegalSection>

      <LegalSection heading="Acceptable use">
        <p>You agree not to use this service to:</p>
        <ul>
          <li>
            Access, store or distribute material that is illegal where you are
            or where the service operates, including child sexual abuse
            material, which we report to the relevant authorities.
          </li>
          <li>
            Attack, scan, overload or attempt to gain unauthorised access to
            any system, whether ours or anyone else&apos;s.
          </li>
          <li>
            Disguise the origin of activity in order to evade a block, a ban,
            a licence restriction or a legal obligation.
          </li>
          <li>
            Infringe copyright or other intellectual property rights, or bypass
            paywalls and access controls.
          </li>
          <li>
            Harass or target another person, or handle someone else&apos;s
            personal data without a lawful basis.
          </li>
          <li>
            Automate, resell or redistribute the service, or run it as
            infrastructure inside another product.
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="Sessions are not anonymous">
        <p>
          We record the address each session opens. Do not treat a session as
          private from the people who operate this service, and do not use it
          as a tool for anonymity — it is not one. See the{" "}
          <Link href="/privacy">privacy page</Link> for exactly what is stored.
        </p>
      </LegalSection>

      <LegalSection heading="We can end a session or refuse service">
        <p>
          We may stop any session, refuse a request, or block access entirely,
          at any time and without notice, to protect the service, to comply
          with the law, or to respond to a report of abuse. Because there are
          no accounts, a block may apply to an address or a network rather than
          to an individual.
        </p>
      </LegalSection>

      <LegalSection heading="No warranty">
        <p>
          The service is provided as it is, with no guarantee of availability,
          reliability or fitness for any purpose. Sessions are short-lived and
          may fail or end early. Do not rely on it for anything important, and
          do not treat it as a security control: it reduces what an untrusted
          page can reach on your own machine, but it does not make a hostile
          site safe.
        </p>
      </LegalSection>

      <LegalSection heading="Liability">
        <p>
          To the extent the law allows, we are not liable for any loss arising
          from use of this service, including loss of data, loss of profit, or
          anything that happens as a result of a site you chose to open. You
          are responsible for what you open and what you do inside a session.
        </p>
      </LegalSection>

      <LegalSection heading="Governing law">
        <p>
          <Pending id="D6">
            which country&apos;s law governs these terms and where disputes are
            heard
          </Pending>
        </p>
      </LegalSection>

      <LegalSection heading="Contact">
        <p>
          Questions about these terms:{" "}
          <Pending id="D2">a contact address for privacy requests</Pending>{" "}
          To report misuse of the service, see the{" "}
          <Link href="/abuse">abuse page</Link>. Last updated{" "}
          <Pending id="D8">the effective date of this version</Pending>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
