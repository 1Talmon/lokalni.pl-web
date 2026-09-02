import { redirect } from 'next/navigation';

interface Props {
    searchParams: Promise<Record<string, string>>;
}

export default async function ResetPasswordPage({ searchParams }: Props) {
    const params = await searchParams;
    const qs = new URLSearchParams(params).toString();
    redirect(`/auth${qs ? `?${qs}` : ''}`);
}
