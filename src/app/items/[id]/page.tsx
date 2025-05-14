import ItemDetailClient from './ItemDetailClient';

interface ItemDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Modified to wait for params
export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  // Ensure params are resolved
  const { id } = await params;
  return <ItemDetailClient itemId={id} />;
} 