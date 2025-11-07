type JsonViewProps = {
    entity: any;
};

const JsonView: React.FC<JsonViewProps> = ({ entity }) => {
    return <pre className="text-xs p-2">
        {JSON.stringify(entity, null, 2)}
    </pre>;
}

export default JsonView;