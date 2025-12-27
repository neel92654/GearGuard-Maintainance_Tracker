/**
 * GearGuard - Empty State Component
 * 
 * Displays when no data is available.
 */

import { Inbox } from 'lucide-react';
import Button from './Button';

function EmptyState({
  icon: Icon = Inbox,
  title = 'No data found',
  description = 'There are no items to display.',
  action = null,
  actionLabel = 'Create New',
  onAction = null,
  className = ''
}) {
  return (
    <div className={`text-center py-12 px-4 ${className}`}>
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 mb-4">
        <Icon className="w-8 h-8 text-gray-400" />
      </div>
      <h3 className="text-lg font-medium text-gray-900 mb-1">{title}</h3>
      <p className="text-gray-500 mb-6 max-w-sm mx-auto">{description}</p>
      {(action || onAction) && (
        <Button onClick={onAction}>
          {action || actionLabel}
        </Button>
      )}
    </div>
  );
}

export default EmptyState;
