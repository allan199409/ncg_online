use ncg;

create table if not exists articles (
	`id` int(11) unsigned not null auto_increment,
    `title` VARCHAR(50),
    `author` VARCHAR(20) not null,
    `short` text,
    `cover` VARCHAR(200),
    `summary` int(11) not null,
    `tags` VARCHAR(200),
    `content` text,
    `count` int(11) default 0,
    `update_time` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    key(id)
)engine=Innodb, default charset = 'utf8';

create table if not exists articles_index(
	`id` int(11) unsigned not null,
	`title_index` text,
    `short_index` text,
    `content_index` text,
    `tag_index` text,
    FULLTEXT KEY `search_title` (`title_index`),
    FULLTEXT KEY `search` (`short_index`, `content_index`, `tag_index`),
    key(id)
)engine=Innodb, default charset = 'utf8';