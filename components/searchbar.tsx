import * as React from "react"
import { Input } from "@/components/ui/input"
import { useTranslation } from "next-i18next"

interface SearchBarProps {
  searchFilter: string
  setSearchFilter: (value: string) => void
}

const SearchBar: React.FC<SearchBarProps> = ({ searchFilter, setSearchFilter }) => {
  const { t } = useTranslation()
  return (
    <Input
      placeholder={t('shadcn.search')}
      value={searchFilter}
      onChange={(event) => setSearchFilter(event.target.value)}
      className="h-8 max-w-sm"
    />
  )
}

export default SearchBar