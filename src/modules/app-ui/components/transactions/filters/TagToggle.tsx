import { Button } from "@/modules/base-ui/components/ui/button";
import { ButtonGroup } from "@/modules/base-ui/components/ui/button-group";

export type TagToggleOptions = 'tagged' | 'untagged';

type TagToggleProps = {
    toggle: TagToggleOptions | undefined;
    setToggle: (toggle: TagToggleOptions | undefined) => void;
    className?: string;
}

const TagToggle: React.FC<TagToggleProps> = ({ toggle, setToggle, className }) => {

    const onToggleClick = (option: TagToggleOptions) => {
        if (toggle === option) {
            setToggle(undefined);
        } else {
            setToggle(option);
        }
    }

    return <ButtonGroup>
        <Button className={toggle !== 'tagged' ? className : ''} variant={toggle === 'tagged' ? 'default' : 'outline'} onClick={() => onToggleClick('tagged')}>
            Tagged
        </Button>
        <Button className={toggle !== 'untagged' ? className : ''} variant={toggle === 'untagged' ? 'default' : 'outline'} onClick={() => onToggleClick('untagged')}>
            Untagged
        </Button>
    </ButtonGroup>
}

export default TagToggle;