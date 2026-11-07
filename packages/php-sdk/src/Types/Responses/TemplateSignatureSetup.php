<?php

declare(strict_types=1);

namespace TurboDocx\Types\Responses;

/**
 * A template's signer roles and anchored fields, for sending it with a role on each recipient. Returned by
 * {@see \TurboDocx\TurboSign::getTemplateSignatureSetup()}.
 */
final class TemplateSignatureSetup
{
    /**
     * @param string $templateId ID of the template
     * @param array<TemplateSignatureRole> $roles Roles in signing order
     * @param array<TemplateSignatureAnchor> $anchors The setup's anchored fields
     */
    public function __construct(
        public string $templateId,
        public array $roles,
        public array $anchors = [],
    ) {}

    /**
     * @param array<string, mixed> $data
     */
    public static function fromArray(array $data): self
    {
        $roles = [];
        foreach (is_array($data['roles'] ?? null) ? $data['roles'] : [] as $role) {
            if (is_array($role)) {
                $roles[] = TemplateSignatureRole::fromArray($role);
            }
        }

        $anchors = [];
        foreach (is_array($data['anchors'] ?? null) ? $data['anchors'] : [] as $anchor) {
            if (is_array($anchor)) {
                $anchors[] = TemplateSignatureAnchor::fromArray($anchor);
            }
        }

        return new self(
            templateId: (string) ($data['templateId'] ?? ''),
            roles: $roles,
            anchors: $anchors,
        );
    }
}
