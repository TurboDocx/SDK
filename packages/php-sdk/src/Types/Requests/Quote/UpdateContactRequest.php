<?php

declare(strict_types=1);

namespace TurboDocx\Types\Requests\Quote;

/**
 * Request for updating a contact
 *
 * Several fields support null-clear semantics: pass `null` + the matching
 * `include<Field>: true` flag to explicitly clear the field on the server.
 * Omitting the field (or leaving the flag `false`) leaves the server value unchanged.
 *
 * Null-clearable fields: `email`, `phone`, `title`
 */
final class UpdateContactRequest
{
    public function __construct(
        public readonly ?string $name = null,
        // email is nullable/null-clearable — use includeEmail: true to
        // explicitly send null (clears the value on the server).
        public readonly ?string $email = null,
        // phone is nullable/null-clearable — use includePhone: true to
        // explicitly send null (clears the value on the server).
        public readonly ?string $phone = null,
        // title is nullable/null-clearable — use includeTitle: true to
        // explicitly send null (clears the value on the server).
        public readonly ?string $title = null,
        public readonly bool $includeEmail = false,
        public readonly bool $includePhone = false,
        public readonly bool $includeTitle = false,
    ) {}

    /**
     * @return array<string, mixed>
     */
    public function toArray(): array
    {
        $data = [];

        if ($this->name !== null) {
            $data['name'] = $this->name;
        }
        if ($this->includeEmail) {
            $data['email'] = $this->email;
        } elseif ($this->email !== null) {
            $data['email'] = $this->email;
        }
        if ($this->includePhone) {
            $data['phone'] = $this->phone;
        } elseif ($this->phone !== null) {
            $data['phone'] = $this->phone;
        }
        if ($this->includeTitle) {
            $data['title'] = $this->title;
        } elseif ($this->title !== null) {
            $data['title'] = $this->title;
        }

        return $data;
    }
}
