import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Tooltip from '../Tooltip';

describe('Tooltip Component', () => {
    it('renders with label and icon', () => {
        render(<Tooltip label="Risk Score" text="This is a test tooltip" />);
        expect(screen.getByText('Risk Score')).toBeInTheDocument();
        expect(screen.getByText('ⓘ')).toBeInTheDocument();
    });

    it('renders only icon when iconOnly is true', () => {
        render(<Tooltip label="Risk Score" text="This is a test tooltip" iconOnly={true} />);
        expect(screen.queryByText('Risk Score')).not.toBeInTheDocument();
        expect(screen.getByText('ⓘ')).toBeInTheDocument();
    });

    it('contains the tooltip text in the hidden box', () => {
        render(<Tooltip label="Risk Score" text="Hidden Intelligence" />);
        const tooltipBox = screen.getByText('Hidden Intelligence');
        expect(tooltipBox).toHaveClass('tooltip-box');
    });
});
