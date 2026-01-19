<?php

declare(strict_types=1);

namespace TurboDocx\Tests\Unit;

use PHPUnit\Framework\TestCase;
use TurboDocx\Utils\FileTypeDetector;

final class FileTypeDetectorTest extends TestCase
{
    public function testDetectPdf(): void
    {
        $pdfContent = '%PDF-1.4 sample content';
        $result = FileTypeDetector::detect($pdfContent);

        $this->assertEquals('application/pdf', $result['mimetype']);
        $this->assertEquals('pdf', $result['extension']);
    }

    public function testDetectDocx(): void
    {
        $docxContent = 'PK' . str_repeat("\x00", 100) . 'word/document.xml';
        $result = FileTypeDetector::detect($docxContent);

        $this->assertEquals('application/vnd.openxmlformats-officedocument.wordprocessingml.document', $result['mimetype']);
        $this->assertEquals('docx', $result['extension']);
    }

    public function testDetectPptx(): void
    {
        $pptxContent = 'PK' . str_repeat("\x00", 100) . 'ppt/presentation.xml';
        $result = FileTypeDetector::detect($pptxContent);

        $this->assertEquals('application/vnd.openxmlformats-officedocument.presentationml.presentation', $result['mimetype']);
        $this->assertEquals('pptx', $result['extension']);
    }

    public function testDetectUnknownZipDefaultsToDocx(): void
    {
        $zipContent = 'PK' . str_repeat("\x00", 100) . 'some/other/file.xml';
        $result = FileTypeDetector::detect($zipContent);

        $this->assertEquals('application/vnd.openxmlformats-officedocument.wordprocessingml.document', $result['mimetype']);
        $this->assertEquals('docx', $result['extension']);
    }

    public function testDetectUnknownFormat(): void
    {
        $unknownContent = 'UNKNOWN FORMAT';
        $result = FileTypeDetector::detect($unknownContent);

        $this->assertEquals('application/octet-stream', $result['mimetype']);
        $this->assertEquals('bin', $result['extension']);
    }
}
