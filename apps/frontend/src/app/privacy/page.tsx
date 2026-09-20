import type { Metadata } from "next";
import { LegalPage, LegalSection } from "@/components/LegalPage";
import { Pending } from "@/components/Pending";

export const metadata: Metadata = {
  title: "Privacy — SafeWeb",
  description: "What SafeWeb stores, for how long, and what it never collects.",
  // Remove once every Pending marker on this page is resolved. Half-written
  // legal text should not be indexed and quoted back at you.
  robots: { index: false, follow: false },
};

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy"
      intro="What this service stores, what it never collects, and what the sites you open can see. Everything below describes how the software actually behaves."
    >
      <LegalSection heading="The short version">
        <p>
          There are no accounts, so we never ask for a name, an email address
          or a password. We do keep a record of each session, which includes
          the address you asked us to open. We run no analytics and load no
          third-party scripts.
        </p>
      </LegalSection>

      <LegalSection heading="What is stored">
        <ul>
          <li>
            <strong>A session cookie.</strong> When you first arrive we set{" "}
            <code>sb_guest_token</code>, a random identifier that lets the
            service tell your sessions apart from someone else&apos;s. It is
            marked <code>HttpOnly</code> and <code>SameSite=Lax</code>, it is
            not readable by scripts, and it carries no expiry date — so your
            browser discards it when you close it. It is not linked to any
            identity and is not used for tracking or advertising.
          </li>
          <li>
            <strong>A session record.</strong> For each session we store the
            address you submitted, an internal container identifier, and
            timestamps for when the session started and ended.
          </li>
          <li>
            <strong>An activity log</strong> recording that a container was
            created, started and stopped, which also contains the address that
            was opened.
          </li>
          <li>
            <strong>Your IP address, briefly.</strong> It is held in memory to
            enforce rate limits and is not written to our database.{" "}
            <Pending id="D9">
              whether the hosting provider keeps access logs, and for how long
            </Pending>
          </li>
        </ul>
      </LegalSection>

      <LegalSection heading="How long it is kept">
        <p>
          <Pending id="D4">
            the retention period for session records and activity logs
          </Pending>
        </p>
        <p>
          The container itself keeps nothing. It is destroyed when the session
          ends, and cookies, cache, downloads and history inside it are
          destroyed with it — no storage from your machine is attached to it,
          so there is nowhere for any of that to survive.
        </p>
      </LegalSection>

      <LegalSection heading="What we do not do">
        <ul>
          <li>No accounts, and no personal details collected.</li>
          <li>No analytics, no tracking pixels, no advertising.</li>
          <li>
            No third-party scripts of any kind. Fonts are served from this site
            rather than fetched from Google, so loading a page here does not
            tell anyone else that you visited.
          </li>
          <li>We do not sell or share session records.</li>
        </ul>
      </LegalSection>

      <LegalSection heading="What the sites you open can see">
        <p>
          The page loads inside a container on our infrastructure, not on your
          machine. The site therefore sees that container&apos;s network
          address rather than yours, and any cookies or storage it sets belong
          to the container and die with it.
        </p>
        <p>
          Your keystrokes and clicks are sent to the container so you can use
          the page. What comes back to you is video of the screen. Anything you
          type into a site during a session — including a password — is sent to
          that site exactly as it would be in your own browser, so a session is
          not protection against a site that is itself untrustworthy.
        </p>
      </LegalSection>

      <LegalSection heading="Sessions are not private from us">
        <p>
          We record the address you open, so the operator can see what was
          requested. We do not record the contents of a session or what you do
          inside it, but you should not treat a session as anonymous or
          confidential from the people who run this service.
        </p>
      </LegalSection>

      <LegalSection heading="Your rights">
        <p>
          <Pending id="D5">
            which access, correction and deletion rights are offered, and how a
            request can be authenticated when the only identifier is a cookie
            the visitor may no longer hold
          </Pending>
        </p>
      </LegalSection>

      <LegalSection heading="Who operates this service">
        <p>
          <Pending id="D1">
            the operating person or company, and the country it operates from
          </Pending>{" "}
          Privacy questions can be sent to{" "}
          <Pending id="D2">a contact address for privacy requests</Pending>
        </p>
      </LegalSection>

      <LegalSection heading="Changes">
        <p>
          If this policy changes materially we will update this page and the
          date below. Last updated{" "}
          <Pending id="D8">the effective date of this version</Pending>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
