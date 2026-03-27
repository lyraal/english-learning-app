import ParentLayout from "@/components/parent/ParentLayout";

export const metadata = {
  title: "家長中心 - EnglishBuddy",
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return <ParentLayout>{children}</ParentLayout>;
}
