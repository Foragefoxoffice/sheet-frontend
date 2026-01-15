export default function Header({ title }) {
    const currentDate = new Date().toDateString();

    return (
        <header className="h-[70px] flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
            <div>
                <span className="badge badge-inprogress">{currentDate}</span>
            </div>
        </header>
    );
}
