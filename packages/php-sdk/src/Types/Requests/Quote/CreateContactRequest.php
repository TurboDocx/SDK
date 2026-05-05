<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for creating a contact
 */
final class CreateContactRequest
{
    public function __construct(
        public readonly string $name,
        public readonly string $companyId,
        public readonly ?string $email = null,
        public readonly ?string $phone = null,
        public readonly ?string $title = null,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [
            'name' => $this->name,
            'companyId' => $this->companyId,
        ];

        if ($this->email !== null) {
            $data['email'] = $this->email;
        }
        if ($this->phone !== null) {
            $data['phone'] = $this->phone;
        }
        if ($this->title !== null) {
            $data['title'] = $this->title;
        }

        return $data;
    }
}
