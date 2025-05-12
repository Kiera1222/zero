import ItemDetailClient from './ItemDetailClient';

interface ItemDetailPageProps {
  params: {
    id: string;
  };
}

// 修改为异步函数，等待 params
export default async function ItemDetailPage({ params }: ItemDetailPageProps) {
  // 确保 params 是已解析的
  const itemId = params.id;
  return <ItemDetailClient itemId={itemId} />;
} 