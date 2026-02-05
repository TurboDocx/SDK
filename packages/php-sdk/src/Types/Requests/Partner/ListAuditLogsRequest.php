<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Partner;

/**
 * Request for listing audit logs with filtering
 */
final class ListAuditLogsRequest
{
    /**
     * @param int $limit Max results per page (1-100, default 50)
     * @param int $offset Pagination offset (default 0)
     * @param string|null $search Search across action, resourceType, and status
     * @param string|null $action Filter by specific action
     * @param string|null $resourceType Filter by resource type
     * @param string|null $resourceId Filter by specific resource ID
     * @param bool|null $success Filter by success status
     * @param string|null $startDate Filter logs from this date (ISO format)
     * @param string|null $endDate Filter logs up to this date (ISO format)
     */
    public function __construct(
        public readonly int $limit = 50,
        public readonly int $offset = 0,
        public readonly ?string $search = null,
        public readonly ?string $action = null,
        public readonly ?string $resourceType = null,
        public readonly ?string $resourceId = null,
        public readonly ?bool $success = null,
        public readonly ?string $startDate = null,
        public readonly ?string $endDate = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toQueryParams(): array
    {
        $params = [
            'limit' => $this->limit,
            'offset' => $this->offset,
        ];

        if ($this->search !== null) {
            $params['search'] = $this->search;
        }
        if ($this->action !== null) {
            $params['action'] = $this->action;
        }
        if ($this->resourceType !== null) {
            $params['resourceType'] = $this->resourceType;
        }
        if ($this->resourceId !== null) {
            $params['resourceId'] = $this->resourceId;
        }
        if ($this->success !== null) {
            $params['success'] = $this->success ? 'true' : 'false';
        }
        if ($this->startDate !== null) {
            $params['startDate'] = $this->startDate;
        }
        if ($this->endDate !== null) {
            $params['endDate'] = $this->endDate;
        }

        return $params;
    }
}
