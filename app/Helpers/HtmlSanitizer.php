<?php

namespace App\Helpers;

use DOMDocument;
use DOMElement;

class HtmlSanitizer
{
    /**
     * Allowed HTML tags for Tiptap Rich Text Editor (Project Notes & Risk)
     */
    protected static array $allowedTags = [
        'p', 'br', 'hr',
        'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
        'strong', 'b', 'em', 'i', 'u', 's', 'strike',
        'span', 'blockquote', 'code', 'pre',
        'ul', 'ol', 'li',
        'table', 'thead', 'tbody', 'tfoot', 'tr', 'th', 'td', 'colgroup', 'col'
    ];

    /**
     * Allowed tag attributes (e.g. for table layouts and alignment)
     */
    protected static array $allowedAttrs = [
        'style', 'class', 'colspan', 'rowspan', 'colwidth', 'width', 'align', 'valign'
    ];

    /**
     * Sanitize rich text HTML input:
     * - Disallows dangerous elements (<script>, <iframe>, <object>, <embed>, <svg>, <form>, <link>, etc.)
     * - Strips all inline event handlers (onclick, onerror, onload, onmouseover, etc.)
     * - Strips javascript: / vbscript: / data: URI schemes
     * - Strips CSS expression / behavior / url()
     * - Preserves safe formatting, headings, lists, and tables
     */
    public static function clean(?string $html): string
    {
        if ($html === null || trim($html) === '') {
            return '';
        }

        // 1. Remove null bytes and carriage returns
        $raw = str_replace(chr(0), '', $html);

        // 2. Strip script, style, and iframe tags completely including their inner text
        $raw = preg_replace('#<script\b[^>]*>(.*?)</script>#is', '', $raw);
        $raw = preg_replace('#<style\b[^>]*>(.*?)</style>#is', '', $raw);
        $raw = preg_replace('#<iframe\b[^>]*>(.*?)(?:</iframe>|$)#is', '', $raw);
        $raw = preg_replace('#<object\b[^>]*>(.*?)(?:</object>|$)#is', '', $raw);
        $raw = preg_replace('#<embed\b[^>]*>(.*?)(?:</embed>|$)#is', '', $raw);

        // 3. Parse via DOMDocument for robust AST-level sanitization
        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML('<?xml encoding="utf-8" ?><div>' . $raw . '</div>', LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD);
        libxml_clear_errors();

        $allElements = [];
        foreach ($dom->getElementsByTagName('*') as $el) {
            $allElements[] = $el;
        }

        foreach ($allElements as $el) {
            $tagName = strtolower($el->nodeName);
            if ($tagName === 'div' && $el->parentNode === null) {
                continue; // wrapper
            }

            // Disallow tags not in whitelist
            if (!in_array($tagName, self::$allowedTags) && $tagName !== 'div') {
                $parent = $el->parentNode;
                if ($parent) {
                    while ($el->hasChildNodes()) {
                        $parent->insertBefore($el->firstChild, $el);
                    }
                    $parent->removeChild($el);
                }
                continue;
            }

            // Sanitize attributes
            if ($el->hasAttributes()) {
                $attrsToRemove = [];
                foreach ($el->attributes as $attr) {
                    $attrName = strtolower($attr->nodeName);

                    // 1. Strip any event handler attribute starting with "on"
                    if (str_starts_with($attrName, 'on')) {
                        $attrsToRemove[] = $attr->nodeName;
                        continue;
                    }

                    // 2. Disallow attributes not in allowed whitelist
                    if (!in_array($attrName, self::$allowedAttrs)) {
                        $attrsToRemove[] = $attr->nodeName;
                        continue;
                    }

                    // 3. Inspect style attribute for CSS expressions or url()
                    if ($attrName === 'style') {
                        if (preg_match('/(expression|javascript|behavior|url\s*\()/i', $attr->nodeValue)) {
                            $attrsToRemove[] = $attr->nodeName;
                        }
                    }
                }

                foreach ($attrsToRemove as $attrName) {
                    $el->removeAttribute($attrName);
                }
            }
        }

        // Extract content inside wrapper div
        $wrapper = $dom->getElementsByTagName('div')->item(0);
        $result = '';
        if ($wrapper) {
            foreach ($wrapper->childNodes as $child) {
                $result .= $dom->saveHTML($child);
            }
        } else {
            $result = $dom->saveHTML();
        }

        return trim($result);
    }

    /**
     * Sanitize plain text string: strips all HTML tags and control characters
     */
    public static function cleanPlainText(?string $text): string
    {
        if ($text === null) {
            return '';
        }
        $stripped = strip_tags($text);
        return trim(str_replace(chr(0), '', $stripped));
    }
}
