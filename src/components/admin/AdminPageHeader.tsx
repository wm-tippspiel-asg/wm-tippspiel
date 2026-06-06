interface Props {
  title: string
  description?: string
  action?: React.ReactNode
}

export function AdminPageHeader({ title, description, action }: Props) {
  return (
    <div className="admin-page-header">
      <div>
        <h1 className="admin-page-title">{title}</h1>
        {description && <p className="admin-page-sub">{description}</p>}
      </div>
      {action && <div className="admin-page-action">{action}</div>}
    </div>
  )
}
