import EditItemClient from './EditItemClient';

interface EditItemPageProps {
  params: {
    id: string;
  };
}

// 修改为异步函数，等待 params
export default async function EditItemPage({ params }: EditItemPageProps) {
  // 确保 params 是已解析的
  const itemId = params.id;
  return <EditItemClient itemId={itemId} />;
} 