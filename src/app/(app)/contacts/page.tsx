import { redirect } from "next/navigation";

/** /contacts has no list of its own — People is the default tab. */
export default function ContactsIndex() {
  redirect("/contacts/people");
}
